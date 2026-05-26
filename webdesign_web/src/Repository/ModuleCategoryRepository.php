<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ModuleCategory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ModuleCategory>
 */
class ModuleCategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ModuleCategory::class);
    }

    /**
     * @return ModuleCategory[]
     */
    public function findAllCategories(): array
    {
        return $this->findAll();
    }

    /**
     * @return ModuleCategory[]
     */
    public function getRecommendedModules(int $limit = 5): array
    {
        $qb = $this->createQueryBuilder('mc')
            ->addSelect('m')
            ->leftJoin('mc.modules', 'm')
            ->where('m.isRecommended = :isRecommended')
            ->andWhere('m.isActive = :isActive')
            ->setParameter('isRecommended', true)
            ->setParameter('isActive', true)
            ->setMaxResults($limit)
            ->orderBy('m.rating', 'DESC')
            ->getQuery()
            ->getResult();

        return $qb;
    }

    public function countModules(): int
    {
        return (int) $this->createQueryBuilder('mc')
            ->select('COUNT(mc.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return ModuleCategory[]
     */
    public function getCategoriesWithCount(): array
    {
        return $this->findAll();
    }
}
