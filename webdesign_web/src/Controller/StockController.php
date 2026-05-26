<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/stock')]
class StockController extends AbstractController
{
    #[Route('/', name: 'app_stock_index')]
    public function index(): Response
    {
        return $this->render('stock/index.html.twig', [
            'pageTitle' => 'Sklad a zásoby',
            'sectionIcon' => 'bx bx-package',
        ]);
    }

    #[Route('/add', name: 'app_stock_add')]
    public function add(): Response
    {
        return $this->redirectToRoute('app_stock_index');
    }
}
