<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/products')]
class ProductController extends AbstractController
{
    #[Route('/', name: 'app_products_index')]
    public function index(): Response
    {
        return $this->render('products/index.html.twig', [
            'pageTitle' => 'Správa zboží a produktů',
            'sectionIcon' => 'bx bx-barcode-alt',
        ]);
    }

    #[Route('/add', name: 'app_products_add')]
    public function add(): Response
    {
        return $this->redirectToRoute('app_products_index');
    }
}
