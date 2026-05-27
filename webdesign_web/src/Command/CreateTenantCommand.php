<?php
// src/Command/CreateTenantCommand.php

namespace App\Command;

use App\Entity\Master\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:tenant:create', description: 'Vytvoří nového tenanta')]
class CreateTenantCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $masterEm,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $name   = $io->ask('Název firmy', 'Lokální vývoj');
        $slug   = $io->ask('Slug', 'localhost');
        $domain = $io->ask('Doména', 'localhost');
        $dbName = $io->ask('Název DB', 'tenant_localhost');

        $tenant = new Tenant();
        $tenant->setName($name);
        $tenant->setSlug($slug);
        $tenant->setDomain($domain);
        $tenant->setDbName($dbName);

        $this->masterEm->persist($tenant);
        $this->masterEm->flush();

        $io->success("Tenant '$name' ($domain) vytvořen.");
        return Command::SUCCESS;
    }
}
